"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Education, ProfileInput, StoredProfile, WorkExperience } from "@/lib/profile-types";
import {
  completeProfileSchema, preloadedProfileUpdateSchema, MAX_PROFILE_INTERESTS, MAX_PROFILE_SKILLS,
  parseProfileInterests, parseProfileSkills, profileErrorTarget,
  profileFieldId, profileValidationResponse, type ProfileFieldErrors,
} from "@/lib/profile-validation";

type FormState = Omit<ProfileInput, "resumeEmbedding">;

const emptyForm: FormState = {
  name: "", profilePhotoUrl: "", resumeUrl: "", cohort: "", skills: [], interests: [],
  workExperience: [], education: [], currentProject: "", lookingFor: "",
  linkedinUrl: "", contactLink: "", fieldsFilledManually: [],
};

async function upload(url: string, file: File) {
  const data = new FormData();
  data.append("file", file);
  const response = await fetch(url, { method: "POST", body: data });
  const result = (await response.json()) as Record<string, unknown> & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Upload failed");
  return result;
}

export function ProfileSetupForm({ initialProfile }: { initialProfile: StoredProfile | null }) {
  const router = useRouter();
  const initial: FormState = initialProfile ? {
    name: initialProfile.name, profilePhotoUrl: initialProfile.profilePhotoUrl, resumeUrl: initialProfile.resumeUrl,
    cohort: initialProfile.cohort, skills: initialProfile.skills, interests: initialProfile.interests ?? [], workExperience: initialProfile.workExperience,
    education: initialProfile.education, currentProject: initialProfile.currentProject, lookingFor: initialProfile.lookingFor,
    linkedinUrl: initialProfile.linkedinUrl, contactLink: initialProfile.contactLink,
    fieldsFilledManually: initialProfile.fieldsFilledManually,
  } : emptyForm;
  const [step, setStep] = useState(initialProfile ? 3 : 1);
  const [form, setForm] = useState<FormState>(initial);
  const [photoPreview, setPhotoPreview] = useState(initialProfile?.profilePhotoUrl ?? "");
  const [resumeName, setResumeName] = useState(initialProfile ? "Current resume" : "");
  const [skillsText, setSkillsText] = useState(initialProfile?.skills.join(", ") ?? "");
  const [interestsText, setInterestsText] = useState(initialProfile?.interests?.join(", ") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [validationStarted, setValidationStarted] = useState(false);
  const [serverErrors, setServerErrors] = useState<ProfileFieldErrors>({});
  const [focusPath, setFocusPath] = useState<string | null>(null);
  const isPreloaded = initialProfile?.origin === "masters_cv";
  const skills = useMemo(() => parseProfileSkills(skillsText), [skillsText]);
  const interests = useMemo(() => parseProfileInterests(interestsText), [interestsText]);
  const payload = useMemo(() => ({ ...form, skills, interests }), [form, skills, interests]);
  const validation = useMemo(
    () => (isPreloaded ? preloadedProfileUpdateSchema : completeProfileSchema).safeParse(payload),
    [isPreloaded, payload],
  );
  const localErrors = validation.success ? {} : profileValidationResponse(validation.error, payload).fieldErrors;
  const fieldErrors: ProfileFieldErrors = {
    ...Object.fromEntries(Object.entries(localErrors).filter(([path]) => validationStarted || profileErrorTarget(path) === "skills")),
    ...serverErrors,
  };

  useEffect(() => {
    if (!focusPath) return;
    const target = document.getElementById(profileFieldId(focusPath));
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "center", behavior: "auto" });
    setFocusPath(null);
  }, [focusPath, step]);

  function focusError(path: string) {
    const target = profileErrorTarget(path);
    setStep(target === "profilePhotoUrl" ? 1 : target === "resumeUrl" ? 2 : 3);
    setFocusPath(path);
  }

  function updateForm(next: React.SetStateAction<FormState>) {
    setForm(next);
    setServerErrors({});
    setError("");
  }

  function updateSkills(value: string) {
    setSkillsText(value);
    setServerErrors({});
    setError("");
  }

  function updateInterests(value: string) {
    setInterestsText(value);
    setServerErrors({});
    setError("");
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setLoading(true);
    try {
      setPhotoPreview(URL.createObjectURL(file));
      const result = await upload("/api/profile/upload-photo", file);
      updateForm((current) => ({ ...current, profilePhotoUrl: String(result.url) }));
      setNotice("Photo uploaded. Continue when you are ready.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload photo"); setPhotoPreview("");
    } finally { setLoading(false); }
  }

  async function handleResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice(""); setLoading(true); setResumeName(file.name);
    try {
      const result = await upload("/api/profile/upload-resume", file);
      const extracted = result.extracted as Partial<FormState>;
      const missingFields = result.missingFields as string[];
      updateForm((current) => ({ ...current, name: extracted.name ?? current.name,
        skills: extracted.skills ?? current.skills, workExperience: extracted.workExperience ?? current.workExperience,
        education: extracted.education ?? current.education, currentProject: extracted.currentProject ?? current.currentProject,
        resumeUrl: String(result.url), fieldsFilledManually: missingFields }));
      setSkillsText((extracted.skills ?? []).join(", "));
      setNotice(result.extractionMode === "ai" ? "Resume analysed. Review the extracted details next." : "Resume analysed locally. Review and complete the missing details next.");
      setStep(3);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not process resume"); setResumeName("");
    } finally { setLoading(false); }
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setServerErrors({}); setValidationStarted(true);
    if (!validation.success) {
      focusError(Object.keys(profileValidationResponse(validation.error, payload).fieldErrors)[0]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/profile/complete", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data) });
      const result = (await response.json()) as { error?: string; redirectTo?: string; fieldErrors?: ProfileFieldErrors };
      if (!response.ok) {
        if (result.fieldErrors && Object.keys(result.fieldErrors).length) {
          setServerErrors(result.fieldErrors);
          focusError(Object.keys(result.fieldErrors)[0]);
          return;
        }
        throw new Error(result.error ?? "Could not save your profile");
      }
      router.push(result.redirectTo ?? "/dashboard"); router.refresh();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save your profile"); }
    finally { setLoading(false); }
  }

  return (
    <section className="mx-auto max-w-5xl px-6 pb-28 pt-8">
      <div className="mx-auto max-w-2xl text-center"><p className="eyebrow">Your private MU profile</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{initialProfile ? "Keep your profile current." : "Build a profile that works for you."}</h1>
        <p className="mt-5 text-base leading-7 text-muted">Upload once, review everything, and control what other verified students can discover.</p></div>
      <StepIndicator current={step} />
      <div className="panel mx-auto mt-10 max-w-3xl p-6 sm:p-9">
        {isPreloaded && <div className="mb-7 rounded-xl border border-teal/30 bg-teal/10 p-4 text-sm leading-6 text-white/85"><strong className="text-teal">Your profile was prepared from the Masters&apos; CV we already had.</strong> Review it and change anything you want. You can add a photo or replace the resume whenever you are ready.</div>}
        {validationStarted && Object.keys(fieldErrors).length > 0 && <div className="mb-7 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300" role="alert" id="profile-profile" tabIndex={-1}>
          <p className="font-semibold">Please correct the following fields before saving:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">{Object.entries(fieldErrors).map(([path, message]) => <li key={path}><button type="button" className="text-left underline underline-offset-4" onClick={() => focusError(path)}>{message}</button></li>)}</ul>
        </div>}
        {step === 1 && <UploadStep field="profilePhotoUrl" error={fieldErrorText(fieldErrors, "profilePhotoUrl")} title="Add your profile photo" description="Choose a clear photo so classmates can recognize you. JPG, PNG, or WebP up to 5 MB." accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} loading={loading} preview={photoPreview} action="Choose photo" />}
        {step === 2 && <UploadStep field="resumeUrl" error={fieldErrorText(fieldErrors, "resumeUrl")} title="Upload your resume" description="We'll extract your skills, experience, and education. Your original resume stays private. PDF or DOCX up to 10 MB." accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleResume} loading={loading} filename={resumeName} action="Choose resume" />}
        {step === 3 && <ReviewForm form={form} setForm={updateForm} skillsText={skillsText} setSkillsText={updateSkills} skillCount={skills.length} interestsText={interestsText} setInterestsText={updateInterests} interestCount={interests.length} errors={fieldErrors} onSubmit={submitProfile} loading={loading} isPreloaded={isPreloaded} />}
        {error && <p className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</p>}
        {notice && !error && <p className="mt-6 rounded-xl border border-teal/20 bg-teal/10 px-4 py-3 text-sm text-teal">{notice}</p>}
        {step < 3 && <div className="mt-8 flex justify-between border-t border-line pt-6"><button className="text-sm font-semibold text-muted disabled:opacity-30" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button><button className="primary-button" disabled={loading || (step === 1 ? !form.profilePhotoUrl : !form.resumeUrl)} onClick={() => { setNotice(""); setStep(step + 1); }}>Continue <span className="ml-2">→</span></button></div>}
      </div>
    </section>
  );
}

function StepIndicator({ current }: { current: number }) {
  const steps = ["Photo", "Resume", "Review"];
  return <div className="mx-auto mt-10 max-w-xl"><div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted"><span>Step {current} of 3</span><span>{steps[current - 1]}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-all" style={{ width: `${(current / 3) * 100}%` }} /></div><div className="mt-3 grid grid-cols-3 text-center text-xs text-muted">{steps.map((label, index) => <span className={index + 1 <= current ? "text-ink" : ""} key={label}>{label}</span>)}</div></div>;
}

function UploadStep({ field, error, title, description, accept, onChange, loading, preview, filename, action }: { field: string; error?: string; title: string; description: string; accept: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; loading: boolean; preview?: string; filename?: string; action: string }) {
  return <div className="text-center"><div className="mx-auto grid size-24 place-items-center overflow-hidden rounded-3xl border border-line bg-elevated">{preview ? <Image src={preview} alt="Profile preview" width={96} height={96} unoptimized className="size-full object-cover" /> : <span className="gradient-text text-4xl">↑</span>}</div><h2 className="mt-6 text-2xl font-semibold">{title}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">{description}</p>{filename && <p className="mt-5 truncate rounded-xl bg-white/5 px-4 py-3 text-sm text-ink">{filename}</p>}<label className="secondary-button mt-7 cursor-pointer focus-within:ring-2 focus-within:ring-teal">{loading ? "Working…" : action}<input id={profileFieldId(field)} type="file" accept={accept} onChange={onChange} className="sr-only" disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? `${profileFieldId(field)}-error` : undefined} /></label><FieldError field={field} error={error} /></div>;
}

function ReviewForm({ form, setForm, skillsText, setSkillsText, skillCount, interestsText, setInterestsText, interestCount, errors, onSubmit, loading, isPreloaded }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; skillsText: string; setSkillsText: (value: string) => void; skillCount: number; interestsText: string; setInterestsText: (value: string) => void; interestCount: number; errors: ProfileFieldErrors; onSubmit: (event: FormEvent<HTMLFormElement>) => void; loading: boolean; isPreloaded: boolean }) {
  const field = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const feedback = (path: string) => ({ field: path, error: fieldErrorText(errors, path) });
  return <form onSubmit={onSubmit} noValidate><fieldset disabled={loading} className="min-w-0">
    <div className="flex flex-col gap-2 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Final review</p><h2 className="mt-2 text-2xl font-semibold">Make it sound like you.</h2></div>{form.fieldsFilledManually.length > 0 && <span className="text-xs text-amber">Review the details extracted from your resume</span>}</div>
    <div className="mt-7 grid gap-6 sm:grid-cols-2">
      <TextInput {...feedback("name")} label="Full name" value={form.name} onChange={(value) => field("name", value)} required />
      <TextInput {...feedback("cohort")} label="Cohort / programme" value={form.cohort} onChange={(value) => field("cohort", value)} placeholder="PGP TBM, Cohort 2026" required />
      <div className="sm:col-span-2"><TextInput {...feedback("skills")} label="Skills" value={skillsText} onChange={setSkillsText} placeholder="Product, Figma, Growth, Python" hint={`${skillCount} / ${MAX_PROFILE_SKILLS} unique skills. Separate with commas; duplicates count once. If over the limit, remove the skills you do not want to keep.`} required /></div>
      <div className="sm:col-span-2"><TextInput {...feedback("interests")} label="Interests" value={interestsText} onChange={setInterestsText} placeholder="Fintech, weddings, climate, D2C" hint={`${interestCount} / ${MAX_PROFILE_INTERESTS} interests. Add topics you genuinely want classmates to find you through.`} /></div>
      <div className="sm:col-span-2"><TextArea {...feedback("currentProject")} label="Current project" value={form.currentProject} onChange={(value) => field("currentProject", value)} placeholder="What are you building or exploring right now?" /></div>
      <div className="sm:col-span-2"><TextArea {...feedback("lookingFor")} label="What are you looking for?" value={form.lookingFor} onChange={(value) => field("lookingFor", value)} placeholder="Co-founder, mentor, user feedback…" required /></div>
      <TextInput {...feedback("linkedinUrl")} label="LinkedIn URL" value={form.linkedinUrl} onChange={(value) => field("linkedinUrl", value)} placeholder="https://linkedin.com/in/..." type="url" />
      <TextInput {...feedback("contactLink")} label="Contact link or email" value={form.contactLink} onChange={(value) => field("contactLink", value)} placeholder="mailto:you@... or https://wa.me/..." required={!isPreloaded} hint={isPreloaded ? "Optional until you choose how other verified students can contact you." : undefined} />
    </div>
    <ExperienceEditor errors={errors} items={form.workExperience} onChange={(items) => setForm((current) => ({ ...current, workExperience: items }))} />
    <EducationEditor errors={errors} items={form.education} onChange={(items) => setForm((current) => ({ ...current, education: items }))} />
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-muted">Only verified MU students will be able to view your profile.</p><button className="primary-button" type="submit" disabled={loading}>{loading ? "Saving profile…" : "Save and enter UniConnect"}</button></div>
  </fieldset></form>;
}

function ExperienceEditor({ items, onChange, errors }: { items: WorkExperience[]; onChange: (items: WorkExperience[]) => void; errors: ProfileFieldErrors }) {
  const update = (index: number, key: keyof WorkExperience, value: string) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  return <section id={profileFieldId("workExperience")} tabIndex={-1} aria-describedby={errors.workExperience ? `${profileFieldId("workExperience")}-error` : undefined} className="mt-9 scroll-mt-8 border-t border-line pt-7">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Work experience</h3><button type="button" disabled={items.length >= 20} className="text-sm font-semibold text-teal disabled:opacity-40" onClick={() => onChange([...items, { company: "", role: "", duration: "", description: "" }])}>+ Add role</button></div>
    <FieldError field="workExperience" error={errors.workExperience} />
    <div className="mt-4 space-y-4">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-line bg-app/40 p-4 sm:grid-cols-3">
      <p className="text-xs text-muted sm:col-span-3">Work experience entry {index + 1}</p>
      {(["company", "role", "duration"] as const).map((key) => <TextInput key={key} field={`workExperience.${index}.${key}`} error={errors[`workExperience.${index}.${key}`]} label={{ company: "Company", role: "Role", duration: "Duration" }[key]} value={item[key]} onChange={(value) => update(index, key, value)} required />)}
      <div className="sm:col-span-3"><TextArea field={`workExperience.${index}.description`} error={errors[`workExperience.${index}.description`]} label="Description" value={item.description} onChange={(value) => update(index, "description", value)} /></div>
      <button type="button" aria-label={`Remove work experience entry ${index + 1}`} className="justify-self-start text-xs text-muted hover:text-red-300" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
    </div>)}</div>
  </section>;
}

function EducationEditor({ items, onChange, errors }: { items: Education[]; onChange: (items: Education[]) => void; errors: ProfileFieldErrors }) {
  const update = (index: number, key: keyof Education, value: string) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  return <section id={profileFieldId("education")} tabIndex={-1} aria-describedby={errors.education ? `${profileFieldId("education")}-error` : undefined} className="mt-9 scroll-mt-8 border-t border-line pt-7">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Education</h3><button type="button" disabled={items.length >= 20} className="text-sm font-semibold text-teal disabled:opacity-40" onClick={() => onChange([...items, { institution: "", degree: "", year: "" }])}>+ Add education</button></div>
    <FieldError field="education" error={errors.education} />
    <div className="mt-4 space-y-4">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-line bg-app/40 p-4 sm:grid-cols-3">
      <p className="text-xs text-muted sm:col-span-3">Education entry {index + 1}</p>
      {(["institution", "degree", "year"] as const).map((key) => <TextInput key={key} field={`education.${index}.${key}`} error={errors[`education.${index}.${key}`]} label={{ institution: "Institution", degree: "Degree", year: "Year" }[key]} value={item[key]} onChange={(value) => update(index, key, value)} required />)}
      <button type="button" aria-label={`Remove education entry ${index + 1}`} className="justify-self-start text-xs text-muted hover:text-red-300" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
    </div>)}</div>
  </section>;
}

function fieldErrorText(errors: ProfileFieldErrors, field: string) {
  return Object.entries(errors).filter(([path]) => profileErrorTarget(path) === field).map(([, message]) => message).join(" ") || undefined;
}

function FieldError({ field, error }: { field: string; error?: string }) {
  return error ? <p id={`${profileFieldId(field)}-error`} className="mt-2 text-sm text-red-300" aria-live="polite">{error}</p> : null;
}

type TextFieldProps = {
  field: string; error?: string; label: string; value: string;
  onChange: (value: string) => void; placeholder?: string; required?: boolean; hint?: string;
};

function TextInput({ field, error, label, value, onChange, placeholder, required, hint, type = "text" }: TextFieldProps & { type?: string }) {
  const id = profileFieldId(field);
  return <div><label htmlFor={id} className="field-label">{label}</label>
    <input id={id} name={field} className={`text-field scroll-mt-8 ${error ? "!border-red-400/70" : ""}`} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} aria-invalid={Boolean(error)} aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined} />
    {hint && <p id={`${id}-hint`} className="mt-2 text-xs text-muted">{hint}</p>}<FieldError field={field} error={error} />
  </div>;
}

function TextArea({ field, error, label, value, onChange, placeholder, required }: TextFieldProps) {
  const id = profileFieldId(field);
  return <div><label htmlFor={id} className="field-label">{label}</label>
    <textarea id={id} name={field} className={`text-field min-h-28 scroll-mt-8 resize-y ${error ? "!border-red-400/70" : ""}`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
    <FieldError field={field} error={error} />
  </div>;
}

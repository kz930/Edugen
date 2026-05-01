import { LessonCreateForm } from "@/components/edugen/LessonCreateForm";

export default function CreatePage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/20 px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create a micro-lesson
          </h1>
          <p className="mt-2 text-muted-foreground">
            Step through topic → sources → generation. Everything here does real work.
          </p>
        </div>
        <LessonCreateForm />
      </div>
    </div>
  );
}

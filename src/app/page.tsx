import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Encuesta JTBD — Colegios
        </h1>
        <p className="text-slate-600">
          Esta es la URL raíz. Para responder la encuesta utilice el link único
          de su colegio (formato <code>/encuesta/[slug]</code>).
        </p>
        <Link
          href="/admin/login"
          className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Ir al panel administrativo →
        </Link>
      </div>
    </main>
  );
}

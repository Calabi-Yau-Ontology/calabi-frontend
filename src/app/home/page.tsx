import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <Link
        href="/calendar"
        className="inline-flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        aria-label="캘린더로 이동"
      >
        <Image
          src="/textloge.png"
          alt="Calabi Home"
          width={640}
          height={240}
          sizes="(max-width: 768px) 70vw, 520px"
          className="h-auto w-[70vw] max-w-[520px]"
          priority
        />
      </Link>
    </div>
  );
}

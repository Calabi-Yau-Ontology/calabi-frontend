import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <Image
        src="/textloge.png"
        alt="Calabi Home"
        width={640}
        height={240}
        sizes="(max-width: 768px) 70vw, 520px"
        className="h-auto w-[70vw] max-w-[520px]"
        priority
      />
    </div>
  );
}

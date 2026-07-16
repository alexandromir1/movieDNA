interface MovieFrameProps {
  frameUrl: string;
  alt?: string;
}

export function MovieFrame({ frameUrl, alt = "Кадр из фильма" }: MovieFrameProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frameUrl}
        alt={alt}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

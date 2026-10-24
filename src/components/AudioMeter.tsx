interface AudioMeterProps {
  level: number;
}

export default function AudioMeter({ level }: AudioMeterProps) {
  return (
    <div className="h-2 w-full bg-[#2A2931] rounded-full overflow-hidden">
      <div
        className="h-full bg-[#4bddb7] transition-all duration-75"
        style={{ width: `${level}%` }}
      />
    </div>
  );
}

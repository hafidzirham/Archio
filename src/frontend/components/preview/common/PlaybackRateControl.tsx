import type React from "react";


interface PlaybackRateControlProps {
  value: number;
  onChange: (rate: number) => void;
  rates?: number[];
  className?: string;
}


const DEFAULT_RATES = [
  0.5,
  1,
  1.25,
  1.5,
];


function PlaybackRateControl({
  value,
  onChange,
  rates = DEFAULT_RATES,
  className = "",
}: PlaybackRateControlProps) {

  return (
    <div
      className={`playback-rate-control ${className}`.trim()}
    >

      <select
        value={value}
        onChange={(
          event: React.ChangeEvent<HTMLSelectElement>
        ) => {

          onChange(
            Number(event.target.value)
          );

        }}
        aria-label="Playback speed"
      >

        {rates.map((rate) => (

          <option
            key={rate}
            value={rate}
          >
            {rate}x
          </option>

        ))}

      </select>

    </div>
  );
}


export default PlaybackRateControl;
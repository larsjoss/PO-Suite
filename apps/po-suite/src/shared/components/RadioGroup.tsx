import { useId } from 'react';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  legend: string;
  hideLegend?: boolean;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
}

export function RadioGroup({
  legend,
  hideLegend = false,
  name,
  value,
  onChange,
  options,
}: RadioGroupProps) {
  const baseId = useId();

  return (
    <fieldset role="radiogroup">
      <legend className={`text-[12px] font-medium text-ink-secondary mb-2 ${hideLegend ? 'sr-only' : ''}`}>
        {legend}
      </legend>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const id = `${baseId}-${opt.value}`;
          const isChecked = value === opt.value;
          const isDisabled = opt.disabled ?? false;

          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={`inline-flex items-center gap-2 select-none ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="relative flex items-center justify-center">
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => onChange(opt.value)}
                  className="sr-only peer"
                />
                <span
                  className={`w-[17px] h-[17px] rounded-full border bg-surface flex items-center justify-center
                    transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-1
                    ${isChecked ? 'border-brand' : 'border-edge'}`}
                  aria-hidden="true"
                >
                  {isChecked && (
                    <span className="w-2 h-2 rounded-full bg-brand" />
                  )}
                </span>
              </span>
              <span className="text-[13px] text-ink">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

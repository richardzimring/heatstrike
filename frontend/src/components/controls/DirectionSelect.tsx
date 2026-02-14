import type { Direction } from '@/types';
import { DIRECTION_OPTIONS } from './constants';
import { OptionsSelect } from './OptionsSelect';

interface DirectionSelectProps {
  value: Direction;
  onChange: (direction: Direction) => void;
}

export function DirectionSelect({ value, onChange }: DirectionSelectProps) {
  return (
    <OptionsSelect
      value={value}
      onChange={onChange}
      options={DIRECTION_OPTIONS}
      label="Direction"
      triggerWidth="sm:w-[90px]"
    />
  );
}

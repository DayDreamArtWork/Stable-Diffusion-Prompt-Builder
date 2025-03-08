"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SDModel } from "@/lib/types";

interface ModelSelectorProps {
  value: SDModel;
  onChange: (value: SDModel) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange as (value: string) => void}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="SD 1.5">SD 1.5</SelectItem>
        <SelectItem value="SDXL">SDXL</SelectItem>
        <SelectItem value="SD 3.5">SD 3.5</SelectItem>
        <SelectItem value="Flux">Flux</SelectItem>
      </SelectContent>
    </Select>
  );
}
import * as React from "react";
import { Clock } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatTo12Hour } from "@/utils/helpers/timeFormatter";

interface TimePickerProps {
	value: string;
	onChange: (time: string) => void;
	label?: string;
	disabled?: boolean;
	className?: string;
}

export function TimePicker({
	value,
	onChange,
	label = "Time",
	disabled = false,
	className,
}: TimePickerProps) {
	const [selectedTime, setSelectedTime] = React.useState<string>(value || "");

	React.useEffect(() => {
		setSelectedTime(value);
	}, [value]);

	const timeOptions = React.useMemo(() => {
		return Array.from({ length: 48 }, (_, i) => {
			const h = String(Math.floor(i / 2)).padStart(2, "0");
			const m = i % 2 === 0 ? "00" : "30";
			return `${h}:${m}`;
		});
	}, []);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"w-full justify-start text-left font-normal",
						!value && "text-muted-foreground",
						disabled && "opacity-50 cursor-not-allowed",
						className
					)}
				>
					<Clock className="mr-2 h-4 w-4" />
					{formatTo12Hour(selectedTime) || "Select time"}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto bg-gray-100 p-4">
				<div className="space-y-2">
					<Label htmlFor="time-picker">{label}</Label>
					<Select
						value={selectedTime}
						onValueChange={(val) => {
							setSelectedTime(val);
							onChange(val);
						}}
						disabled={disabled}
					>
						<SelectTrigger className="w-full bg-gray-400 text-white font-semibold">
							<SelectValue placeholder="Select time" />
						</SelectTrigger>
						<SelectContent>
							{timeOptions.map((time) => (
								<SelectItem key={time} value={time}>
									{formatTo12Hour(time)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</PopoverContent>
		</Popover>
	);
}

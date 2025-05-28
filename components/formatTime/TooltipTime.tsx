import { formatTimestamp } from "@/utils/tools";
import { Tooltip } from "@heroui/tooltip";

export default function TooltipTime({
  time,
  showTimezone = true,
}: {
  time: number;
  showTimezone?: boolean;
}) {
  return (
    <Tooltip content={formatTimestamp(time, false, "YYYY-MM-DD HH:mm:ss")}>
      {formatTimestamp(time, showTimezone)}
    </Tooltip>
  );
}

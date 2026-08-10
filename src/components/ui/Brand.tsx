import { Ranking } from "@phosphor-icons/react";
import { Text } from "./Text";

/** The Unicord lockup. The header and the sign-in modal show the same one. */
export function Brand() {
  return (
    <div className="flex items-center gap-[9px]">
      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[linear-gradient(150deg,var(--color-accent-500),var(--color-accent-800))] shadow-[0_0_0_1px_var(--color-accent-700)]">
        <Ranking weight="fill" size={18} className="text-accent-100" />
      </div>
      <Text variant="ui" className="font-semibold tracking-[-0.01em]">
        Unicord
      </Text>
    </div>
  );
}

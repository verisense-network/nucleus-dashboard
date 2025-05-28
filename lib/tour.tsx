import { TourProvider as TourWrapperProvider } from "@reactour/tour";

export default function TourProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TourWrapperProvider
      steps={[]}
      styles={{
        popover: (base) => ({
          ...base,
          backgroundColor: "#1e1e1e",
        }),
        arrow: (base, state) => ({
          ...base,
          color: state?.disabled === true ? "#555" : "#999",
        }),
      }}
    >
      {children}
    </TourWrapperProvider>
  );
}

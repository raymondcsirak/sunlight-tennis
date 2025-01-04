export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {children}
    </div>
  );
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

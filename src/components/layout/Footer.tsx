export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 px-6 md:px-12 border-t mt-auto">
      <div className="container mx-auto text-center text-muted-foreground text-sm">
        <p>© {currentYear} Prime Evoke Private Limited. All Rights Reserved.</p>
        {/* We will add social media icons here later */}
      </div>
    </footer>
  );
}
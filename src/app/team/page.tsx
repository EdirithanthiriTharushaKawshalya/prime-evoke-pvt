import { getTeamMembers } from "@/lib/data"; // You'll create this function
import { TeamMemberCard } from "@/components/ui/TeamMemberCard";
import { Dialog } from "@/components/ui/dialog"; // Import Dialog
import { Footer } from "@/components/layout/Footer";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";

// 1. Remove 'params' from the function signature
export default async function TeamPage() {
  // 2. Remove the line that extracts 'studioId'
  // const { studioId } = await params; // DELETE THIS LINE

  const teamMembers = await getTeamMembers();

  const management = teamMembers.filter(m => m.is_management);
  const staff = teamMembers.filter(m => !m.is_management);

  return (
    <Dialog>
      {" "}
      {/* Wrap the whole page or relevant section in the Dialog provider */}
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-center mb-12" data-aos="fade-up">
          Meet Our Team
        </h1>

        {/* Management Section */}
        <section data-aos="fade-up" data-aos-delay="100">
          <h2 className="text-3xl font-bold mb-8">Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {management.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        {/* Staff Section */}
        {staff.length > 0 && (
          <section className="mt-16" data-aos="fade-up" data-aos-delay="200">
            <h2 className="text-3xl font-bold mb-8">Our Staff</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {staff.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </Dialog>
  );
}

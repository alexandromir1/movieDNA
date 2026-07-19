import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { ProfileOverview } from "@/components/profile/ProfileOverview";

export const metadata: Metadata = {
  title: "Профиль",
};

export default function ProfilePage() {
  return (
    <Container>
      <ProfileOverview />
    </Container>
  );
}

import { Link } from 'react-router-dom';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { Section, SectionHeader } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users } from 'lucide-react';

export function CommunityFeedSection() {
  return (
    <Section>
      <SectionHeader
        label="Community"
        title="See What's Happening"
        description="Real-time activity from architecture students across the platform"
      />
      <div className="max-w-2xl mx-auto">
        <CommunityFeed limit={8} />
        <div className="text-center mt-8">
          <Link to="/forum">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" /> Join the Community <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}

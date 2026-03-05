/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const LOGO_URL = 'https://ddvfcymvhnlvqcbhozpc.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Archistudio — verify your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={heroSection}>
          <Img src={LOGO_URL} width="48" height="48" alt="Archistudio" style={logo} />
          <Heading style={heroTitle}>Archistudio</Heading>
        </Section>
        <Section style={contentSection}>
          <Heading style={h1}>Welcome aboard.</Heading>
          <Text style={text}>
            You're one step away from joining a practice-driven community of architects and designers at{' '}
            <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          </Text>
          <Text style={text}>
            Verify your email address (<Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>) to unlock your learning journey:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Verify & Get Started
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', 'Inter', Arial, sans-serif" }
const container = { maxWidth: '520px', margin: '0 auto', padding: '0' }
const heroSection = { backgroundColor: '#2d1520', padding: '32px 25px 24px', textAlign: 'center' as const, borderRadius: '14px 14px 0 0' }
const logo = { margin: '0 auto 12px' }
const heroTitle = { fontSize: '18px', fontWeight: '600' as const, color: '#c9a84c', margin: '0', letterSpacing: '0.5px' }
const contentSection = { padding: '32px 25px 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2d1520', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#c9a84c', textDecoration: 'underline' }
const button = { backgroundColor: '#2d1520', color: '#c9a84c', fontSize: '15px', fontWeight: '600' as const, borderRadius: '14px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, margin: '8px 0 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', padding: '0 25px 24px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }

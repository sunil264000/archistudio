/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = 'https://ddvfcymvhnlvqcbhozpc.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Archistudio verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={heroSection}>
          <Img src={LOGO_URL} width="48" height="48" alt="Archistudio" style={logo} />
          <Heading style={heroTitle}>Archistudio</Heading>
        </Section>
        <Section style={contentSection}>
          <Heading style={h1}>Confirm your identity</Heading>
          <Text style={text}>Use the code below to verify it's you:</Text>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>This code expires shortly. If you didn't request this, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', 'Inter', Arial, sans-serif" }
const container = { maxWidth: '520px', margin: '0 auto', padding: '0' }
const heroSection = { backgroundColor: '#2d1520', padding: '32px 25px 24px', textAlign: 'center' as const, borderRadius: '14px 14px 0 0' }
const logo = { margin: '0 auto 12px' }
const heroTitle = { fontSize: '18px', fontWeight: '600' as const, color: '#c9a84c', margin: '0', letterSpacing: '0.5px' }
const contentSection = { padding: '32px 25px 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2d1520', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: "'Space Grotesk', Courier, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: '#2d1520', backgroundColor: '#faf6ef', border: '2px solid #c9a84c', borderRadius: '14px', padding: '16px 24px', textAlign: 'center' as const, letterSpacing: '6px', margin: '0 0 20px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', padding: '0 25px 24px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }

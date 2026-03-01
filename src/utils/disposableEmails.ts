/**
 * List of known disposable/temporary email domains.
 * Not exhaustive but covers the most common ones.
 */
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.info',
  'grr.la', 'guerrillamailblock.com', 'sharklasers.com', 'guerrillamail.net',
  'guerrillamail.de', 'mailinator.com', 'trashmail.com', 'trashmail.me',
  'trashmail.net', 'yopmail.com', 'yopmail.fr', 'throwaway.email',
  'dispostable.com', 'maildrop.cc', 'mailnesia.com', 'tempail.com',
  'tempr.email', 'discard.email', 'discardmail.com', 'discardmail.de',
  'disposableemailaddresses.emailmiser.com', 'drdrb.net', 'emailgo.de',
  'fakeinbox.com', 'fastacura.com', 'filzmail.com', 'getairmail.com',
  'gishpuppy.com', 'harakirimail.com', 'iminbox.com', 'inboxclean.com',
  'incognitomail.org', 'jetable.org', 'kasmail.com', 'koszmail.pl',
  'kurzepost.de', 'lhsdv.com', 'lookugly.com', 'mailcatch.com',
  'mailexpire.com', 'mailmoat.com', 'mailnull.com', 'mailshell.com',
  'mailsiphon.com', 'mailzilla.org', 'mbx.cc', 'mega.zik.dj',
  'meltmail.com', 'mintemail.com', 'mt2015.com', 'mytempemail.com',
  'nobulk.com', 'noclickemail.com', 'nogmailspam.info', 'nomail.xl.cx',
  'nomail2me.com', 'nospam.ze.tc', 'nospamfor.us', 'nowmymail.com',
  'objectmail.com', 'obobbo.com', 'onewaymail.com', 'owlpic.com',
  'proxymail.eu', 'punkass.com', 'putthisinyouremail.com', 'reallymymail.com',
  'recode.me', 'regbypass.com', 'safetymail.info', 'skeefmail.com',
  'slaskpost.se', 'slipry.net', 'spambox.us', 'spamcowboy.com',
  'spamex.com', 'spamfree24.org', 'spamgourmet.com', 'spamherelots.com',
  'spamhole.com', 'spaml.com', 'spammotel.com', 'spamslicer.com',
  'spamspot.com', 'spamstack.net', 'superrito.com', 'teleworm.us',
  'tempemail.co.za', 'tempemail.net', 'tempinbox.com', 'tempmail.eu',
  'tempmaildemo.com', 'tempmailer.com', 'temporaryemail.net', 'temporaryinbox.com',
  'thankyou2010.com', 'thisisnotmyrealemail.com', 'throwawayemailaddress.com',
  'tittbit.in', 'tradermail.info', 'trash-amil.com', 'trash-mail.at',
  'trashymail.com', 'trashymail.net', 'wegwerfmail.de', 'wegwerfmail.net',
  'wh4f.org', 'whyspam.me', 'willhackforfood.biz', 'xagloo.com',
  'xemaps.com', 'xents.com', 'xmaily.com', 'xoxy.net',
  'zehnminutenmail.de', 'zippymail.info', '10minutemail.com', '20minutemail.com',
  'mailtemp.info', 'tempail.com', 'burpcollaborator.net', 'mailsac.com',
  'mohmal.com', 'getnada.com', 'emailondeck.com', 'crazymailing.com',
  'disposable.ml', 'tmail.ws', 'tmpmail.net', 'tmpmail.org',
  'bupmail.com', 'emailfake.com', 'generator.email', 'guerrillamail.org',
  'sharklasers.com', 'spam4.me', 'trash-mail.com',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

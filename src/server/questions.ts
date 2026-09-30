export interface Question {
  prompt: string;
  choices: [string, string, string, string];
  correctAnswerIndex: number;
  explanation: string;
}

export const QUESTIONS: Question[] = [
  {
    prompt: "A message says your package is held and asks you to sign in through its link. What is safest?",
    choices: ["Open the link to check", "Visit the carrier's official site yourself", "Reply with your address", "Forward it to friends"],
    correctAnswerIndex: 1,
    explanation: "Use a known official website or app instead of a link in an unexpected message.",
  },
  {
    prompt: "Which password is the strongest choice for a unique account?",
    choices: ["Summer2026!", "Your pet's name", "A long, randomly generated password", "The same password you use elsewhere"],
    correctAnswerIndex: 2,
    explanation: "Long, unique passwords are harder to guess; a password manager can create and store them.",
  },
  {
    prompt: "What does multi-factor authentication add to a password?",
    choices: ["A second kind of proof of identity", "A longer username", "Automatic backups", "An antivirus scan"],
    correctAnswerIndex: 0,
    explanation: "MFA asks for another factor, such as a security key or authenticator approval.",
  },
  {
    prompt: "A caller claiming to be IT asks you to read out a login code. What should you do?",
    choices: ["Share it if they sound confident", "Ask them to text you first", "Do not share it; verify using a known IT contact", "Share only the first half"],
    correctAnswerIndex: 2,
    explanation: "One-time codes can let someone access your account. Verify requests through a trusted channel.",
  },
  {
    prompt: "A familiar-looking link has a misspelled domain. What is the safest move?",
    choices: ["Click quickly before it expires", "Open the real service by typing its address yourself", "Disable browser warnings", "Sign in to see where it goes"],
    correctAnswerIndex: 1,
    explanation: "Lookalike domains are commonly used to imitate trusted sites; navigate independently.",
  },
  {
    prompt: "What is a sensible way to use public Wi-Fi?",
    choices: ["Turn off device updates", "Use it for any sensitive task without checking", "Prefer trusted sites and avoid sensitive activity on networks you do not trust", "Share files with everyone nearby"],
    correctAnswerIndex: 2,
    explanation: "Untrusted networks can expose traffic or lead to fake hotspots. Use HTTPS and defer sensitive tasks when possible.",
  },
  {
    prompt: "An unexpected attachment asks you to enable macros. What should you do?",
    choices: ["Enable them to view the file", "Verify the message with the sender through another channel", "Rename the attachment", "Disable your security software"],
    correctAnswerIndex: 1,
    explanation: "Unexpected files and macro prompts can deliver malware. Confirm legitimacy before opening or enabling content.",
  },
  {
    prompt: "Why keep a backup that is separate from your everyday device?",
    choices: ["It makes passwords unnecessary", "It can help recover files if the device is lost, damaged, or encrypted by malware", "It prevents phishing", "It guarantees no data loss"],
    correctAnswerIndex: 1,
    explanation: "A separate, tested backup can help restore data after many kinds of incidents, including ransomware.",
  },
  {
    prompt: "You think you entered your password on a fake site. What should you do first?",
    choices: ["Wait to see what happens", "Change the password from the official site and report the incident", "Delete your browser", "Send the password to a colleague"],
    correctAnswerIndex: 1,
    explanation: "Use the real service to change the exposed password, and alert the relevant support or security team.",
  },
  {
    prompt: "A coworker messages urgently for a gift-card purchase and says to keep it secret. This is a warning sign of:",
    choices: ["A normal software update", "A social-engineering scam", "A password reset", "A backup reminder"],
    correctAnswerIndex: 1,
    explanation: "Urgency, secrecy, and unusual payment requests are common pressure tactics. Verify independently.",
  },
  {
    prompt: "What should you do with an MFA approval you did not initiate?",
    choices: ["Approve it to clear the notification", "Ignore it and report it; change your password if needed", "Send a screenshot of the code", "Turn off MFA"],
    correctAnswerIndex: 1,
    explanation: "An unexpected prompt may mean someone has your password. Deny it and report the attempt.",
  },
  {
    prompt: "Which is a safer way to share a sensitive document?",
    choices: ["Post a public link", "Use an approved sharing service with access limited to intended people", "Attach it to a public chat", "Use a shortened link from an unknown site"],
    correctAnswerIndex: 1,
    explanation: "Restrict access to named recipients and use approved sharing tools instead of public links.",
  },
  {
    prompt: "A browser warns that a download may be dangerous. What should you do?",
    choices: ["Ignore the warning because it is probably wrong", "Stop and verify the source before downloading", "Disable the warning", "Download it on another device"],
    correctAnswerIndex: 1,
    explanation: "A warning is a reason to pause and verify the download through a trusted source.",
  },
  {
    prompt: "Why install security updates for your operating system and apps?",
    choices: ["They can fix known security weaknesses", "They make every email trustworthy", "They replace backups", "They remove the need for MFA"],
    correctAnswerIndex: 0,
    explanation: "Updates often include fixes for vulnerabilities attackers might otherwise exploit.",
  },
  {
    prompt: "You discover a USB drive in a public place. What is safest?",
    choices: ["Plug it in to identify its owner", "Take it to your organization's IT or security team", "Use it only while offline", "Give it to a stranger"],
    correctAnswerIndex: 1,
    explanation: "Unknown removable drives may contain malicious software. Let support handle them safely.",
  },
  {
    prompt: "A website's address begins with HTTPS. What does that tell you?",
    choices: ["The site is definitely honest", "The connection is encrypted, but the site itself may still be fraudulent", "The site has no malware", "Your password is protected from every threat"],
    correctAnswerIndex: 1,
    explanation: "HTTPS protects data in transit to that domain; it does not prove the site is legitimate.",
  },
  {
    prompt: "What is the safest response to a request to bypass a normal approval process?",
    choices: ["Do it if the request is urgent", "Follow established procedures and verify the request", "Use a personal account instead", "Ask the requester for their password"],
    correctAnswerIndex: 1,
    explanation: "Attackers often use urgency or authority to push people around safeguards. Verify and follow policy.",
  },
  {
    prompt: "Why use a different password for every important account?",
    choices: ["It prevents a breach at one service from automatically exposing other accounts", "It makes MFA unnecessary", "It hides your email address", "It stops spam"],
    correctAnswerIndex: 0,
    explanation: "Unique passwords limit damage from credential reuse when a service is breached.",
  },
  {
    prompt: "You accidentally clicked a suspicious link but did not enter details. What is a good next step?",
    choices: ["Report it and follow your organization's guidance", "Enter a fake password to test it", "Forward it to everyone", "Delete the security alert"],
    correctAnswerIndex: 0,
    explanation: "Report suspicious links promptly; support can advise on device checks and next steps.",
  },
  {
    prompt: "What should you do before scanning a QR code from an unexpected flyer?",
    choices: ["Scan it without looking", "Check whether the source is trustworthy and inspect the destination before opening", "Disable your phone's security settings", "Enter your password into whatever opens"],
    correctAnswerIndex: 1,
    explanation: "QR codes can hide malicious or misleading links. Check the destination and avoid unexpected sign-in prompts.",
  },
];

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import * as _t from "./types";
import * as _f from "./fns";

export type * from "./types";

export const create = () => new SESClient({ apiVersion: "2010-12-01" });

/**
 * phone notifications: `<fromName> <subject>`
 *
 * email: `<fromName> <subject>`
 *
 * email opened:
 *
 * `<subject>` (as email title)
 *
 * From `<fromName> <from>`
 *
 * To `<to>`
 *
 * `<content>`
 */
export const send = (ses: SESClient, email: _t.Email) => {
  const Source = `"${email.fromName}" <${email.from}>`;
  console.log(`[ses] Sending email to ${email.to} from ${email.from}`);

  const Destination = { ToAddresses: [email.to] };
  const Body = {
    Html: { Charset: "UTF-8", Data: email.content },
    Text: {
      Charset: "UTF-8",
      Data: email.textContent || _f.stripHtml(email.content),
    },
  };

  const Subject = { Charset: "UTF-8", Data: email.subject };

  const command = new SendEmailCommand({
    Message: { Subject, Body },
    Destination,
    Source,
  });

  return ses.send(command);
};

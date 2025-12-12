import * as _t from "./types";

export class HttpError extends Error {
  statusCode: _t.ResponseOptions["status"];
  /** human-readable vague error message sent to client. */
  display: string;
  /** internal log message for debugging. */
  log?: string;

  constructor(props: {
    statusCode: _t.ResponseOptions["status"];
    display?: string;
    log: string;
  }) {
    super(props.log);
    this.statusCode = props.statusCode;
    this.display = props.display!;
    this.log = props.log;
  }
}

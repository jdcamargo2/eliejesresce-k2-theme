interface Submission {
  readonly id: string;
  payload: Record<string, unknown>;
}

export class SubmissionService {
  constructor(private readonly endpoint: URL) {}

  async load(id: string): Promise<Submission | null> {
    const response = await fetch(`${this.endpoint}/${id}`);

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<Submission>;
  }
}
export type Crowdfunding = {
    address: string;
    metadata: {
      name: string;
      version: string;
      spec: string;
      description: string;
    };
    instructions: Instruction[];
    accounts: IdlAccount[]; // Keep using IdlAccount here
    types: Type[];
  };
  
  type Instruction = {
    name: string;
    discriminator: number[];
    accounts: IdlAccount[]; // Keep using IdlAccount here
    args: Argument[];
  };
  
  type IdlAccount = {
    name: string;
    discriminator: number[]; // Make sure discriminator is always present
    writable?: boolean;
    signer?: boolean;
    address?: string;
    pda?: {
      seeds: PDASeed[];
    };
  };
  
  type PDASeed = {
    kind: "const" | "account";
    value?: number[];
    path?: string;
  };
  
  type Argument = {
    name: string;
    type: "string" | "u64";
  };
  
  type Type = {
    name: string;
    type: {
      kind: "struct";
      fields: Field[];
    };
  };
  
  type Field = {
    name: string;
    type: "pubkey" | "string" | "u64";
  };
  
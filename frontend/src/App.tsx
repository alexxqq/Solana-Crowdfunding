import { useEffect, useState, useCallback } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  AnchorProvider,
  Program,
  Wallet,
  web3,
  utils,
  BN,
} from "@coral-xyz/anchor";
import idl from "./idl.json";
import * as buffer from "buffer";
import styled from "styled-components";
import { ConfirmOptions } from "@solana/web3.js";
import CampaignCard  from "./components/CampaignCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

window.Buffer = buffer.Buffer;

const { SystemProgram } = web3;
const programID = new PublicKey(idl.address);
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed" as web3.Commitment,
};

declare global {
  interface Window {
    solana?: Wallet;
  }
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: "Space Grotesk", sans-serif;
  background-color: black;
`;

const Header = styled.h1`
  color: #ffffff;
  font-size: 2.5em;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background-color: #00da63;
  color: rgba(0, 0, 0, 0.7);
  font-family: "Space Grotesk", sans-serif;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px 0;
  font-size: 1em;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  appearance: textfield;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  padding: 10px;
  margin: 5px;
  border: 1px solid #ccc;
  background-color: black;
  color: white;
  font-family: "Space Grotesk", sans-serif;

  border-radius: 4px;
  font-size: 1em;
  width: 200px;

  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;

const Box = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #0f0f0f;
  border-radius: 8px;
  padding: 8px 15px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
`;

const Content = styled.div`
  display: flex;
  gap: 2rem;

  @media screen and (max-width: 768px) {
    flex-direction: column;
  }
`;

const Title = styled.h2`
  color: white;
`;


function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [donationAmount, setDonationAmount] = useState<number>(0.01);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0.01);
  const [campaignName, setCampaignName] = useState<string>("");
  const [campaignDescription, setCampaignDescription] = useState<string>("");

  const getProvider = useCallback((): AnchorProvider => {
    if (!window.solana) throw new Error("Phantom Wallet is not connected.");
    const connection = new Connection(network, opts.preflightCommitment);
    return new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment as ConfirmOptions
    );
  }, []);

  const checkPhantomWallet = useCallback(async (): Promise<boolean> => {
    const { solana } = window as any;
    if (solana?.isPhantom) {
      try {
        const response = await solana.connect({ onlyIfTrusted: true });
        setWalletAddress(response.publicKey.toString());
        return true;
      } catch (error) {
        console.error("Error connecting to Phantom Wallet.");
      }
    } else {
		console.error("No Phantom Wallet Found. Please install Phantom Wallet.");
    }
    return false;
  }, []);

  const connectWallet = async () => {
    const { solana } = window as any;
    if (solana?.isPhantom) {
      try {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
      } catch (error) {
        toast.error("Error connecting wallet.");
      }
    } else {
      toast.warn("No Phantom Wallet Found. Please install Phantom Wallet.");
    }
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      const connection = new Connection(network, opts.preflightCommitment);
      const provider = getProvider();
      const program = new Program<any>(idl, provider) as any;
      const accounts = await connection.getProgramAccounts(programID);

      const campaigns = await Promise.all(
        accounts.map(async (campaign) => ({
          ...(await program.account.campaign.fetch(campaign.pubkey)),
          pubkey: campaign.pubkey,
        }))
      );

      const userCampaign = campaigns.find(
        (campaign) => campaign.admin.toString() === walletAddress
      );

      if (userCampaign) {
        const filteredCampaigns = campaigns.filter(
          (campaign) =>
            campaign.pubkey.toString() !== userCampaign.pubkey.toString()
        );

        setCampaigns([
          { ...userCampaign, isUserCampaign: true },
          ...filteredCampaigns,
        ]);
      } else {
        setCampaigns(campaigns);
      }
    } catch (error) {
      toast.error("Error fetching campaigns.");
    }
  }, [getProvider, walletAddress]);

  const createCampaign = async () => {
    if (!campaignName || !campaignDescription) {
      toast.warn("Please enter both a campaign name and description.");
      return;
    }

    try {
      const provider = getProvider();
      const program = new Program<any>(idl, provider) as any;
      const [campaignPda] = PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
          provider.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .create(Buffer.from(campaignName), Buffer.from(campaignDescription))
        .accounts({
          campaign: campaignPda,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("Campaign created successfully.");
      fetchCampaigns();
    } catch (error) {
      toast.error("Error creating campaign.");
    }
  };

  const handleTransaction = async (
    action: "donate" | "withdraw",
    publicKey: PublicKey,
    amount: number
  ) => {
    try {
      const provider = getProvider();
      const program = new Program<any>(idl, provider) as any;
      await program.methods[action](new BN(amount * web3.LAMPORTS_PER_SOL))
        .accounts({
          campaign: publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success(
        `${action.charAt(0).toUpperCase() + action.slice(1)} successful!`
      );
      fetchCampaigns();
    } catch (error) {
      toast.error(
        `${action.charAt(0).toUpperCase() + action.slice(1)} failed.`
      );
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (await checkPhantomWallet()) fetchCampaigns();
    };
    initialize();
  }, [checkPhantomWallet, fetchCampaigns]);
  const userOwnsCampaign = campaigns.some(
    (campaign) => campaign.admin.toString() === walletAddress
  );
  return (
    <Container>
      <Header>Solana Campaign DApp</Header>
      {!walletAddress ? (
        <Button onClick={connectWallet}>Connect to Wallet</Button>
      ) : (
        <Content>
          <Section>
            {!userOwnsCampaign && (
              <Box>
                <Title>Create Campaign</Title>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Campaign Name"
                />
                <Input
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Campaign Description"
                />
                <Button onClick={createCampaign}>Create Campaign</Button>
              </Box>
            )}

            <Box>
              <Title>Donation / Withdrawal</Title>
              <Input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(Number(e.target.value))}
                placeholder="Donation Amount"
              />
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                placeholder="Withdrawal Amount"
              />
            </Box>
          </Section>
          <Section>
            <Title>Active Campaigns</Title>
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.pubkey.toString()}
                campaign={campaign}
                donationAmount={donationAmount}
                withdrawAmount={withdrawAmount}
                donate={(pubkey, amount) =>
                  handleTransaction("donate", pubkey, amount)
                }
                withdraw={(pubkey, amount) =>
                  handleTransaction("withdraw", pubkey, amount)
                }
                walletAddress={walletAddress!}
              />
            ))}
          </Section>
        </Content>
      )}
      <ToastContainer />
    </Container>
  );
}

export default App;

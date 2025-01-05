import styled from "styled-components";
import { web3 } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const CampaignContainer = styled.div`
  background-color: #0f0f0f;
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  max-width: 600px;
  margin: 10px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;
const Balance = styled.p`
  color: #b3b3b3;
`;
const CampaignTitle = styled.h3`
  color: #9f9f9f;
  margin: 0;
  margin-bottom: 1rem;
`;

const CampaignText = styled.p`
  color: #666;
  margin: 5px 0;
`;

const CampaignButton = styled.button`
  background-color: #00da63;
  color: rgba(0, 0, 0, 0.7);
  font-family: "Space Grotesk", sans-serif;

  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;

  &:hover {
    background-color: #00da63;
  }
`;

const PinLabel = styled.div`
  background-color: #883f3f;
  color: #fff;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;

  &::before {
    content: "📌";
    margin-right: 5px;
  }
`;

const CampaignCard = ({
  campaign,
  donationAmount,
  withdrawAmount,
  donate,
  withdraw,
  walletAddress,
}: {
  campaign: any;
  donationAmount: number;
  withdrawAmount: number;
  donate: (publicKey: PublicKey, amount: number) => void;
  withdraw: (publicKey: PublicKey, amount: number) => void;
  walletAddress: string;
}) => (
  <CampaignContainer key={campaign.pubkey.toString()}>
    {campaign.isUserCampaign && <PinLabel>Your Campaign</PinLabel>}
    <CampaignTitle>{campaign.name}</CampaignTitle>
    {/* <CampaignTitle>{campaign.pubkey.toString()}</CampaignTitle> */}
    <CampaignText>{campaign.description}</CampaignText>
    <Balance>
      Balance: {(campaign.amountDonated / web3.LAMPORTS_PER_SOL).toFixed(2)} SOL
    </Balance>
    <CampaignButton onClick={() => donate(campaign.pubkey, donationAmount)}>
      Donate {donationAmount} SOL
    </CampaignButton>
    {campaign.admin.toString() === walletAddress && (
      <CampaignButton onClick={() => withdraw(campaign.pubkey, withdrawAmount)}>
        Withdraw {withdrawAmount} SOL
      </CampaignButton>
    )}
  </CampaignContainer>
);

export default CampaignCard;

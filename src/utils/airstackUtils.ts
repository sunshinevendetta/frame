// airstackUtils.ts
import {
    init,
    getFarcasterUserDetails,
    getFarcasterUserNFTBalances,
    TokenBlockchain,
    NFTType,
    checkNFTOwnership,
    FarcasterUserDetailsInput,
    FarcasterUserDetailsOutput,
    FarcasterUserNFTBalancesInput,
    FarcasterUserNFTBalancesOutput,
    CheckNFTOwnershipInput,
    CheckNFTOwnershipOutput,
  } from "@airstack/frames";
  
  // Initialize Airstack SDK with your API key
  init(process.env.NEXT_PUBLIC_AIRSTACK_API_KEY);
  
  // Function to fetch Farcaster user details
  export const fetchUserDetails = async (fid: number): Promise<FarcasterUserDetailsOutput['data'] | null> => {
    try {
      const input: FarcasterUserDetailsInput = { fid };
      const { data, error }: FarcasterUserDetailsOutput = await getFarcasterUserDetails(input);
      if (error) {
        console.error("Error fetching user details:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };
  
  // Function to fetch user's NFT balances
  export const fetchUserNFTBalances = async (fid: number): Promise<FarcasterUserNFTBalancesOutput['data'] | null> => {
    try {
      const input: FarcasterUserNFTBalancesInput = {
        fid,
        chains: [TokenBlockchain.Ethereum, TokenBlockchain.Polygon, TokenBlockchain.Base, TokenBlockchain.Zora],
        tokenType: [NFTType.ERC721, NFTType.ERC1155],
        limit: 100,
      };
      const { data, error }: FarcasterUserNFTBalancesOutput = await getFarcasterUserNFTBalances(input);
      if (error) {
        console.error("Error fetching user NFT balances:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error fetching user NFT balances:", error);
      return null;
    }
  };
  
  // Function to check if a user holds a specific NFT
  export const checkNFTOwnership = async (fid: number, nftAddress: string): Promise<boolean> => {
    try {
      const input: CheckNFTOwnershipInput = {
        fid,
        token: [
          { chain: TokenBlockchain.Ethereum, tokenAddress: nftAddress },
          { chain: TokenBlockchain.Polygon, tokenAddress: nftAddress },
          { chain: TokenBlockchain.Base, tokenAddress: nftAddress },
          { chain: TokenBlockchain.Zora, tokenAddress: nftAddress },
        ],
      };
      const { data, error }: CheckNFTOwnershipOutput = await checkNFTOwnership(input);
      if (error) {
        console.error("Error checking NFT ownership:", error);
        return false;
      }
      return data.some((result) => result.isHold);
    } catch (error) {
      console.error("Error checking NFT ownership:", error);
      return false;
    }
  };
  
  // Function to retrieve the user's Farcaster ID (FID)
  export const getFID = async (userAddress: string): Promise<number | null> => {
    try {
      const input: FarcasterUserDetailsInput = {
        identity: userAddress,
      };
      const { data, error }: FarcasterUserDetailsOutput = await getFarcasterUserDetails(input);
      if (error) {
        console.error("Error retrieving user's FID:", error);
        return null;
      }
      return data.fid;
    } catch (error) {
      console.error("Error retrieving user's FID:", error);
      return null;
    }
  };
  
  // Function to retrieve the user's Ethereum address
  export const getUserAddress = async (fid: number): Promise<string | null> => {
    try {
      const input: FarcasterUserDetailsInput = { fid };
      const { data, error }: FarcasterUserDetailsOutput = await getFarcasterUserDetails(input);
      if (error) {
        console.error("Error retrieving user's address:", error);
        return null;
      }
      if (data.userAssociatedAddresses && data.userAssociatedAddresses.length > 0) {
        return data.userAssociatedAddresses[0];
      } else {
        console.error("No associated addresses found for the user");
        return null;
      }
    } catch (error) {
      console.error("Error retrieving user's address:", error);
      return null;
    }
  };
  
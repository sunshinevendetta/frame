// dynamicUtils.ts
import { DynamicSDK } from "@dynamic-labs/sdk-react-core";

const dynamicSDK = new DynamicSDK(process.env.NEXT_PUBLIC_DYNAMIC_API_KEY);

export async function hasUserRecast(userAddress: string): Promise<boolean> {
  try {
    const response = await dynamicSDK.checkRecast(userAddress);
    return response.data.hasRecast;
  } catch (error) {
    console.error("Error checking user recast:", error);
    return false;
  }
}

export async function buyNFT(userAddress: string): Promise<boolean> {
  try {
    const amount = 0.001; // Amount of ETH to purchase the NFT

    // Use Dynamic SDK to handle NFT purchase
    const { data, error } = await dynamicSDK.buyNFT(userAddress, amount);
    if (error) {
      console.error("Error buying NFT:", error);
      return false;
    }

    console.log("NFT purchased successfully");
    return true;
  } catch (error) {
    console.error("Error buying NFT:", error);
    return false;
  }
}

export async function buyCredits(userAddress: string): Promise<boolean> {
  try {
    const amount = 0.001; // Amount of ETH to purchase credits

    // Use Dynamic SDK to handle credit purchase
    const { data, error } = await dynamicSDK.buyCredits(userAddress, amount);
    if (error) {
      console.error("Error buying credits:", error);
      return false;
    }

    console.log("Credits purchased successfully");
    return true;
  } catch (error) {
    console.error("Error buying credits:", error);
    return false;
  }
}

export async function earnExtraLife(userAddress: string): Promise<boolean> {
  try {
    // Check if the user has already recast the frame
    const hasRecast = await hasUserRecast(userAddress);

    if (!hasRecast) {
      // User hasn't recast yet, grant an extra life
      console.log("Extra life earned successfully");

      // Update the user's recast status using the Dynamic SDK
      await dynamicSDK.updateRecastStatus(userAddress, true);

      return true;
    } else {
      console.log("User has already recast, no extra life granted");
      return false;
    }
  } catch (error) {
    console.error("Error earning extra life:", error);
    return false;
  }
}

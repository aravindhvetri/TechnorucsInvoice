import { sp } from "@pnp/sp/presets/all";
import { graph } from "@pnp/graph/presets/all";
import { ADGroups } from "../../Config/Config";

export const azureMembers = async (): Promise<any[]> => {
  try {
   const members = await graph.groups.getById(ADGroups.Managers).members();
    
    const userDetail: any[] = members.map((user: any, i: number) => ({
      key: i + 1,
      imgUrl: `/_layouts/15/userphoto.aspx?size=S&accountname=${user?.userPrincipalName || ""}`,
      text: user?.displayName || "",
      ID: user?.id || null,
      secondaryText: user?.userPrincipalName || "",
      isValid: true,
    }));

    return userDetail;
  } catch (error) {
    console.error("Error fetching Azure group members:", error);
    return [];
  }
};

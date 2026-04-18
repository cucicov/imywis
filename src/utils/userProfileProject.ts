import type {Edge, Node} from '@xyflow/react';
import {supabase} from './supabaseClient.ts';

export type ExportedNodesJson = {
  nodes: Node[];
  edges: Edge[];
};

export const saveProjectDataToUserProfile = async (
  userId: string,
  exportedNodesJson: ExportedNodesJson
) => {
  const {data: byUserIdData, error: byUserIdError} = await supabase
    .from('user_profiles')
    .update({data: exportedNodesJson})
    .eq('user_id', userId);

  if (byUserIdError) {
    console.error('Error updating profile data by user_id:', byUserIdError);
    throw new Error(`Failed to update profile data by user_id: ${byUserIdError.message}`);
  }

  if (byUserIdData) {
    return;
  }
};

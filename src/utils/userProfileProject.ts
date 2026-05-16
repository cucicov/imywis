import type {Edge, Node} from '@xyflow/react';
import {supabase} from './supabaseClient.ts';
import {uploadBase64ImageToStorage} from './imageUpload.ts';

export type ExportedNodesJson = {
  nodes: Node[];
  edges: Edge[];
};

export const saveProjectDataToUserProfile = async (
  userId: string,
  exportedNodesJson: ExportedNodesJson
) => {
  // Upload all Base64 images to Supabase Storage and replace with public URLs
  const projectDataWithUploadedImages = await uploadAllBase64ImagesAndReplaceWithUrls(
    exportedNodesJson,
    userId
  );

  const sanitizedProjectData = sanitizeProjectForProfileStorage(projectDataWithUploadedImages);

  const {data: byUserIdData, error: byUserIdError} = await supabase
    .from('user_profiles')
    .update({data: sanitizedProjectData})
    .eq('user_id', userId);

  if (byUserIdError) {
    console.error('Error updating profile data by user_id:', byUserIdError);
    throw new Error(`Failed to update profile data by user_id: ${byUserIdError.message}`);
  }

  if (byUserIdData) {
    return;
  }
};

/**
 * Uploads all Base64 images found in the project data to Supabase Storage
 * and replaces the Base64 data URLs with public URLs
 */
const uploadAllBase64ImagesAndReplaceWithUrls = async (
  projectData: ExportedNodesJson,
  userId: string
): Promise<ExportedNodesJson> => {
  const processedNodes = await Promise.all(
    projectData.nodes.map(async (node) => {
      // Deep clone to avoid mutations
      const clonedNode = JSON.parse(JSON.stringify(node));

      // Process metadata.sourceNodes if they exist (where image data is stored in page nodes)
      if (clonedNode.data?.metadata?.sourceNodes) {
        clonedNode.data.metadata.sourceNodes = await Promise.all(
          clonedNode.data.metadata.sourceNodes.map(async (sourceNode: {
            nodeId: string;
            type: string;
            handleType: string;
            data: Record<string, unknown>;
          }) => {
            // Upload image if it has localImageDataUrl (Base64 encoded image)
            if (
              sourceNode.data.localImageDataUrl &&
              typeof sourceNode.data.localImageDataUrl === 'string' &&
              sourceNode.data.localImageDataUrl.startsWith('data:image/')
            ) {
              try {
                const fileName = (sourceNode.data.localImageFileName as string) || `image-${sourceNode.nodeId}`;
                const {publicUrl} = await uploadBase64ImageToStorage(
                  sourceNode.data.localImageDataUrl,
                  userId,
                  fileName
                );

                console.log(`✅ Uploaded image for node ${sourceNode.nodeId}: ${fileName}`);

                // Replace localImageDataUrl with the public URL in the path field
                return {
                  ...sourceNode,
                  data: {
                    ...sourceNode.data,
                    path: publicUrl, // Set the public URL as the path
                    localImageDataUrl: undefined, // Remove Base64 data to save space
                  },
                };
              } catch (error) {
                console.error(`❌ Failed to upload image for node ${sourceNode.nodeId}:`, error);
                // Keep original data on error (fallback to Base64)
                return sourceNode;
              }
            }

            return sourceNode;
          })
        );
      }

      // Also process direct node data (for image nodes that might have localImageDataUrl)
      if (
        clonedNode.data?.localImageDataUrl &&
        typeof clonedNode.data.localImageDataUrl === 'string' &&
        clonedNode.data.localImageDataUrl.startsWith('data:image/')
      ) {
        try {
          const fileName = (clonedNode.data.localImageFileName as string) || `image-${clonedNode.id}`;
          const {publicUrl} = await uploadBase64ImageToStorage(
            clonedNode.data.localImageDataUrl,
            userId,
            fileName
          );

          console.log(`✅ Uploaded image for node ${clonedNode.id}: ${fileName}`);

          clonedNode.data.path = publicUrl;
          clonedNode.data.localImageDataUrl = undefined;
        } catch (error) {
          console.error(`❌ Failed to upload image for node ${clonedNode.id}:`, error);
          // Keep original data on error
        }
      }

      return clonedNode;
    })
  );

  return {
    nodes: processedNodes,
    edges: projectData.edges,
  };
};

const sanitizeProjectForProfileStorage = (projectData: ExportedNodesJson): ExportedNodesJson => {
  // Images are already uploaded and replaced with URLs in uploadAllBase64ImagesAndReplaceWithUrls
  // No further sanitization needed
  return projectData;
};

// const stripLocalImageDataUrl = (value: unknown): unknown => {
//   if (Array.isArray(value)) {
//     return value.map((item) => stripLocalImageDataUrl(item));
//   }
//
//   if (typeof value !== 'object' || value === null) {
//     return value;
//   }
//
//   const output: Record<string, unknown> = {};
//   Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
//     if (key === 'localImageDataUrl') {
//       return;
//     }
//     output[key] = stripLocalImageDataUrl(nestedValue);
//   });
//   return output;
// };

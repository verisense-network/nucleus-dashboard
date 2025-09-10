import { Buffer } from "buffer";
import storage from "./googleStorage";
import { ArrayBuffer as SparkArrayBuffer } from "spark-md5";

const bucketName = "dashboard-image-bucket";
const destination = "upload-image";

export async function uploadImageWithGoogleStorage(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const bucket = storage.bucket(bucketName);
    const spark = new SparkArrayBuffer();
    spark.append(arrayBuffer);
    const filename = file.name.replace(/\s/g, "_");
    const uploadPath = `${destination}/${spark.end()}-${filename}`;
    const bucketFile = bucket.file(uploadPath);

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${uploadPath}`;

    const [exists] = await bucketFile.exists();
    if (exists) {
      return publicUrl;
    }

    await bucketFile.save(Buffer.from(arrayBuffer), {
      gzip: true,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    return publicUrl;
  } catch (error) {
    console.error("error uploading image", error);
    throw new Error("failed to upload image");
  }
}

import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

import crypto from 'crypto';

import dotenv from "dotenv";

dotenv.config({ path: './config.env' });

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY as string;
const secretAccessKey = process.env.SECRET_ACCESS_KEY as string;

const defaultRegion = "us-east-1";

const s3Config: S3ClientConfig = {
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion || defaultRegion,
};

const s3 = new S3Client(s3Config);

export { s3, bucketName, randomImageName };

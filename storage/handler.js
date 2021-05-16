"use strict";
const { v4: uuidv4 } = require("uuid");
const fileUpload = require("express-fileupload");
const Minio = require("minio");
const { coreConfig, storageConfig } = require("./config");
const { verifyJWTFromCookei } = require("./common");
const cors = require("cors");

const bucket_name = process.env.STORAGE_BUCKET;

var minioClient = new Minio.Client({
  endPoint: process.env.MINIO_END_POINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

/**
 * Get file extension from file name
 * @param {string} filename
 * @returns
 */
function getExtension(filename) {
  return filename.split(".").pop();
}

/**
 * Post file handler
 * @param {*} req
 * @param {*} res
 * @returns
 */
const postHandler = function (req, res) {
  let file;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }
  const { dir } = req.params;
  const { uid } = res.locals;

  // The name of the input field (i.e. "file") is used to retrieve the uploaded file
  file = req.files.file;
  const mimetype = file.mimetype;
  const fileName = file.name;
  const fileExt = getExtension(fileName);
  const fileUUID = uuidv4();
  const newFileName = `${fileUUID}.${fileExt}`;
  const filePath = `${uid}/${dir}/${newFileName}`;
  minioClient.putObject(
    bucket_name,
    filePath,
    file.data,
    file.size,
    function (err, objInfo) {
      if (err) {
        return console.log(err); // err should be null
      } else {
        const baseURL = coreConfig.gateway + storageConfig.baseRoute;
        const url = `${baseURL}/${uid}/${dir}/${newFileName}`;

        res.send({ success: true, payload: { url } });
        console.log("[INFO] Success", objInfo);
      }
    }
  );
};

/**
 * Get file handler
 * @param {*} req
 * @param {*} res
 * @returns
 */
const getHandler = function (req, res) {
  const {uid, dir, name } = req.params;
  const filePath = `${uid}/${dir}/${name}`;
  console.log("[INFO] Get file ", filePath);
  minioClient.getObject(bucket_name, filePath, function (error, stream) {
    if (error) {
      return res.status(500).send(error);
    }
    stream.pipe(res);
  });
};

module.exports = async (config) => {
  config.app.disable('x-powered-by')
  const whitelist = coreConfig.origin.split(',').map((url) => url.trim())

  console.log("Origin whitelist: ", whitelist);

  var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
      corsOptions = { origin: true, credentials: true } // reflect (enable) the requested origin in the CORS response
    } else {
      corsOptions = { origin: false, credentials: true } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
  }

  config.app.use(cors(corsOptionsDelegate));

  config.app.use(fileUpload());

  // set a cookie
  config.app.use(function (req, res, next) {
    console.log("[INFO] Auth method ", storageConfig.authMethod);
    console.log("[INFO] Request method ", req.method);
    console.log("[INFO] Request URL: ", req.originalUrl);
    console.log("[INFO] Cookie ", req.headers.cookie);
    console.log("[INFO] Origin ", req.headers.origin);
    if (req.method !== 'OPTIONS') {
      if (storageConfig.authMethod === "param") {
        res.locals.uid = req.originalUrl.split("/")[1];
      } else if (storageConfig.authMethod === "cookie" && req.headers.cookie) {
        const { claim } = verifyJWTFromCookei(req.headers.cookie);
        res.locals.uid = claim.uid;
      }
      console.log("[INFO] User ID ", res.locals.uid);
    }
    next();
  });
  config.app.post(`/:uid/:dir`, postHandler);
  config.app.get(`/:uid/:dir/:name`, getHandler);
};

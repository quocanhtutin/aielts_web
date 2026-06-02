import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/**
 * Upload file từ buffer (multer memoryStorage)
 */
export const streamUpload = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,                  // thư mục lưu trên cloudinary
        resource_type: "auto"    // tự nhận diện image / video / audio
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    // convert buffer → stream
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

/**
 * API: upload file
 * - nhận file từ form-data
 * - trả về url + public_id + resource_type
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // folder do frontend gửi, nếu không có thì default
    const folder = req.body.folder || "ielts";

    const result = await streamUpload(req.file, folder);

    return res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Upload failed"
    });
  }
};

/**
 * API: xóa file trên cloudinary
 * - cần public_id
 * - resource_type phải đúng (image / video)
 */
export const deleteFile = async (req, res) => {
  try {
    const { public_id, resource_type } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: "Missing public_id"
      });
    }

    await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type || "image"
    });

    return res.json({
      success: true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
};

export const deleteCloudinaryAudios = async (publicIds = []) => {
  try {
    const ids = publicIds.filter(Boolean);

    if (!ids.length) return;

    await cloudinary.api.delete_resources(ids, {
      resource_type: "video"
    });

  } catch (err) {
    console.error("Delete cloudinary audios error:", err);
  }
};
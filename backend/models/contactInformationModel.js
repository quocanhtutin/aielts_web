import mongoose from "mongoose";

const contactInformationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    branches: [{ type: String }],
    phoneContact: { type: String, required: true },
    emailContact: { type: String, required: true },
    links: [
        {
            webName: String,
            link: String
        }
    ]
}, { timestamps: true });

const contactInformationModel =
    mongoose.models.Information || mongoose.model("Information", contactInformationSchema);

export default contactInformationModel;

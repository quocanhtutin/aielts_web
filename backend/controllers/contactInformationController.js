import contactInformationModel from "../models/contactInformationModel.js";

const updateInforContact = async (req, res) => {
    try {
        const { name, description, address, phoneContact, emailContact, branches, links } = req.body;
        // const branches = JSON.parse(req.body.branches)
        // const links = JSON.parse(req.body.links)

        const existingInfo = await contactInformationModel.findOne();

        if (existingInfo) {
            await contactInformationModel.updateOne(
                { _id: existingInfo._id },
                { name, description, address, branches, phoneContact, emailContact, links }
            );
            res.json({ success: true, message: "Information updated successfully" });
        } else {
            await contactInformationModel.create({
                name,
                description,
                address,
                branches,
                phoneContact,
                emailContact,
                links
            });
            res.json({ success: true, message: "Information created successfully" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Update Information Failed", error: error.message });
    }
}

const getInforContact = async (req, res) => {
    try {
        const info = await contactInformationModel.findOne();
        res.json({ success: true, data: info });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch information" });
    }
}

export { updateInforContact, getInforContact }

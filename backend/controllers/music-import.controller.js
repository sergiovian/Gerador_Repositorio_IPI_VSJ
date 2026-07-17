const MusicImportService=require('../services/music-import.service');
const { runChurchContext } = require('../constants/church-context');
async function preview(req,res){const data=await MusicImportService.preview(req.files,req.user.churchId);res.status(200).json({data});}
async function confirm(req,res){const data=await runChurchContext(req.user.churchId,()=>MusicImportService.importSongs(req.body.songs));res.status(201).json({data});}
module.exports={preview,confirm};

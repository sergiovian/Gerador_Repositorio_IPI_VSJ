const MusicImportService=require('../services/music-import.service');
async function preview(req,res){res.status(200).json({data:await MusicImportService.preview(req.files)});}
async function confirm(req,res){res.status(201).json({data:await MusicImportService.importSongs(req.body.songs)});}
module.exports={preview,confirm};

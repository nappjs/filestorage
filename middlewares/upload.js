const NappJSService = require('nappjs').NappJSService;
const FileStorage = require('file-storage');

const storage = new FileStorage(process.env.FILESTORAGE_URL);
const HOST_URL = process.env.HOST_URL || 'http://example.com';

class UploadService extends NappJSService {
  async load(napp) {
    let api = napp.getService('nappjs-api');

    api.app.post('/upload', async (req, res, next) => {
      try {
        let file = req.context.create('File');
        await storage.saveStream(req, file.uid);
        await req.context.save();
        let data = file.getValues();
        data.url = `${HOST_URL}/${file.uid}`;
        res.send(data);
      } catch (err) {
        next(err);
      }
    });
    api.app.get('/files/:uid', (req, res, next) => {
      res.redirect(`../${req.params.uid}`);
    });
    api.app.get('/:uid', async (req, res, next) => {
      try {
        let file = await req.context.getObject('File', {
          where: { uid: req.params.uid }
        });

        if (!file) {
          res.status(404).send('File not found');
        } else {
          if (file.mimeType) {
            res.set('Content-Type', file.mimeType);
          }

          if (file.size) {
            res.set('Content-Length', file.size);
          }
          if (file.name) {
            let disposition = req.query.download ? 'attachment' : 'inline';
            res.set(
              'Content-Disposition',
              `${disposition}; filename="${encodeURIComponent(file.name)}"`
            );
          }

          let stream = await storage.getStream(file.uid);
          stream.pipe(res);
        }
      } catch (err) {
        next(err);
      }
    });
  }
}

module.exports = UploadService;

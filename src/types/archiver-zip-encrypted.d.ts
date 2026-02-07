declare module 'archiver-zip-encrypted' {
    import archiver = require('archiver');
    function create(options?: any): archiver.Archiver;
    namespace create { }
    export = create;
}
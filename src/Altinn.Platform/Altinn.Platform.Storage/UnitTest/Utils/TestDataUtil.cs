using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace App.IntegrationTests.Utils
{
    public class TestDataUtil
    {
        public static void PrepareInstance(int instanceOwnerId, string instanceGuid)
        {
            PrepareInstance(instanceOwnerId, new Guid(instanceGuid));
        }

        public static void PrepareInstance(int instanceOwnerId, Guid instanceGuid, string org = null, string app = null)
        {
            string instancePath = GetInstancePath(instanceGuid);

            string preInstancePath = instancePath.Replace(".json", ".pretest.json");

            File.Copy(preInstancePath, instancePath);

            if (org != null && app != null)
            {
                string blobPath = GetBlobPathForApp(org, app, instanceGuid.ToString());
                if (Directory.Exists(blobPath + "pretest"))
                {
                    DirectoryCopy(blobPath + "pretest", blobPath, true);
                }
            }
        }

        public static void DeleteInstance(int instanceOwnerId, Guid instanceGuid)
        {
            string instancePath = GetInstancePath(instanceGuid);
            if (File.Exists(instancePath))
            {
                File.Delete(instancePath);
            }
        }

        public static void DeleteInstanceAndDataAndBlobs(int instanceOwnerId, string instanceguid, string org, string app)
        {
            DeleteInstanceAndData(instanceOwnerId, new Guid(instanceguid));
            string path = GetBlobPathForApp(org, app, instanceguid);
            if (Directory.Exists(path))
            {
                Directory.Delete(path, true);
            }
        }

        public static void DeleteInstanceAndData(int instanceOwnerId, string instanceguid)
        {
            DeleteInstanceAndData(instanceOwnerId, new Guid(instanceguid));
        }

        public static void DeleteInstanceAndData(int instanceOwnerId, Guid instanceGuid)
        {
           DeleteDataForInstance(instanceOwnerId, instanceGuid);

            string instancePath = GetInstancePath(instanceGuid);
            if (File.Exists(instancePath))
            {
                File.Delete(instancePath);
            }
        }

        

        public static void DeleteDataForInstance(int instanceOwnerId, Guid instanceGuid)
        {
            string path = GetDataPath(instanceOwnerId, instanceGuid);
            if (Directory.Exists(path))
            {
                Directory.Delete(path, true);
            }
        }

        private static string GetInstancePath(Guid instanceGuid)
        {
            string unitTestFolder = Path.GetDirectoryName(new Uri(typeof(TestDataUtil).Assembly.CodeBase).LocalPath);
            return Path.Combine(unitTestFolder, @"..\..\..\data\cosmoscollections\instances\", instanceGuid.ToString() + @".json");
        }

        private static string GetDataPath(int instanceOwnerId, Guid instanceGuid)
        {
            string unitTestFolder = Path.GetDirectoryName(new Uri(typeof(TestDataUtil).Assembly.CodeBase).LocalPath);
            return Path.Combine(unitTestFolder, @"..\..\..\data\cosmoscollections\dataelements", instanceOwnerId + @"\", instanceGuid.ToString());
        }

        private static string GetBlobPathForApp(string org, string app, string instanceId)
        {
            string unitTestFolder = Path.GetDirectoryName(new Uri(typeof(TestDataUtil).Assembly.CodeBase).LocalPath);
            return Path.Combine(unitTestFolder, @"..\..\..\data\blob\", org + @"\", app + @"\", instanceId);
        }

        private static void DirectoryCopy(string sourceDirName, string destDirName, bool copySubDirs)
        {
            // Get the subdirectories for the specified directory.
            DirectoryInfo dir = new DirectoryInfo(sourceDirName);

            if (!dir.Exists)
            {
                throw new DirectoryNotFoundException(
                    "Source directory does not exist or could not be found: "
                    + sourceDirName);
            }

            DirectoryInfo[] dirs = dir.GetDirectories();
            // If the destination directory doesn't exist, create it.
            if (!Directory.Exists(destDirName))
            {
                Directory.CreateDirectory(destDirName);
            }

            // Get the files in the directory and copy them to the new location.
            FileInfo[] files = dir.GetFiles();
            foreach (FileInfo file in files)
            {
                string temppath = Path.Combine(destDirName, file.Name);
                file.CopyTo(temppath, false);
            }

            // If copying subdirectories, copy them and their contents to new location.
            if (copySubDirs)
            {
                foreach (DirectoryInfo subdir in dirs)
                {
                    string temppath = Path.Combine(destDirName, subdir.Name);
                    DirectoryCopy(subdir.FullName, temppath, copySubDirs);
                }
            }
        }
    }
}

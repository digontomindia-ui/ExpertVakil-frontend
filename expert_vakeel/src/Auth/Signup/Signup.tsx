import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clientAPI } from "../../services/api";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "../../lib/firebase";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  // const [profilePic, setProfilePic] = useState<File | null>(null);
  // const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle profile picture selection
  // const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setProfilePic(file);
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       setProfilePicPreview(e.target?.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // Upload file to Firebase Storage
  // const uploadToFirebase = async (file: File): Promise<string> => {
  //   try {
  //     // Create a unique filename in temp folder (before user is authenticated)
  //     const timestamp = Date.now();
  //     const fileName = `profile_pics/temp/${timestamp}_${file.name}`;

  //     // Create storage reference
  //     const storageRef = ref(storage, fileName);

  //     // Upload file
  //     const snapshot = await uploadBytes(storageRef, file);

  //     // Get download URL
  //     const downloadURL = await getDownloadURL(snapshot.ref);

  //     return downloadURL;
  //   } catch (error) {
  //     console.error('Error uploading to Firebase:', error);
  //     throw new Error('Failed to upload image');
  //   }
  // };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !city || !password) { alert("All fields are required"); return; }

    try {
      setLoading(true);

      // Prepare signup data
      const signupData: any = {
        name: fullName.trim(),
        email,
        password,
        phone,
        city,
      };

      // Upload profile picture to Firebase if selected
      // if (profilePic) {
      //   console.log("Uploading profile picture to Firebase...");
      //   const imageUrl = await uploadToFirebase(profilePic);
      //   console.log(imageUrl)
      //   signupData.profilePic = imageUrl;
      //   console.log("Profile picture uploaded successfully:", imageUrl);
      // }

      console.log("Sending signup data:", { ...signupData, password: "[HIDDEN]" });
      const { data } = await clientAPI.register(signupData);
      console.log("Signup response:", data);

      // Store token and client data (token is also set as httpOnly cookie)
      localStorage.setItem("token", data.token);
      localStorage.setItem("client", JSON.stringify(data.data));

      // Handle Firebase authentication if token is provided
      try {
        if (data.firebaseToken) {
          const { signInWithCustomToken } = await import('firebase/auth');
          const { auth } = await import('../../lib/firebase');
          await signInWithCustomToken(auth, data.firebaseToken);
          console.log('Firebase authentication successful');
        }
      } catch (firebaseErr) {
        console.error("Firebase authentication failed:", firebaseErr);
        // Don't fail signup if Firebase auth fails
      }

      alert("Signup successful! Redirecting to home...");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Signup error:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);

      const errorMessage = err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Signup failed";
      alert(`Signup failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <main className="w-full max-w-[400px] px-6 text-center">
        <img src="/assets/Group1.png" alt="Expert Vakeel" className="mx-auto mb-6 h-24 w-auto select-none" draggable={false} />

        <h1 className="mb-3 text-[40px] leading-none font-extrabold tracking-tight text-[#6F6F6F]">Sign Up</h1>

        <p className="mb-8 text-[13px] text-black">
          Already have an account? <Link to="/login" className="font-semibold text-black underline">Log In Here.</Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-14 w-full rounded-[28px] bg-[#F6F6F6] text-center text-[18px] font-semibold text-[#111] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-black/10 placeholder:font-medium placeholder:text-[#9CA3AF]" />

          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 w-full rounded-[28px] bg-[#F6F6F6] text-center text-[18px] font-semibold text-[#111] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-black/10 placeholder:font-medium placeholder:text-[#9CA3AF]" />

          <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-14 w-full rounded-[28px] bg-[#F6F6F6] text-center text-[18px] font-semibold text-[#111] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-black/10 placeholder:font-medium placeholder:text-[#9CA3AF]" />

          <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="h-14 w-full rounded-[28px] bg-[#F6F6F6] text-center text-[18px] font-semibold text-[#111] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-black/10 placeholder:font-medium placeholder:text-[#9CA3AF]" />

          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 w-full rounded-[28px] bg-[#F6F6F6] text-center text-[18px] font-semibold text-[#111] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-black/10 placeholder:font-medium placeholder:text-[#9CA3AF]" />

          {/* Profile Picture Upload */}
          {/* <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Profile Picture (Optional)</label>
            <div className="flex flex-col items-center space-y-3">
              {profilePicPreview && (
                <img
                  src={profilePicPreview}
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
                <div className="h-12 px-4 rounded-[24px] bg-[#F6F6F6] text-center text-[14px] font-medium text-[#666] border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center">
                  {profilePic ? "Change Photo" : "Upload Photo"}
                </div>
              </label>
            </div>
          </div> */}

          <button type="submit" disabled={loading} className="mt-2 h-14 w-full rounded-[28px] bg-[#FFA800] text-[20px] font-extrabold text-white shadow-[0_10px_24px_rgba(255,168,0,0.35)] transition active:scale-[0.99] disabled:opacity-60">
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </main>
    </div>
  );
}

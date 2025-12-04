import { useState} from "react";
import { supabase } from "../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { EnvelopeIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SignUpForm() {
    const[email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = async(e) => {
        e.preventDefault();
        setError(null);

        if(!email || !password){
            setMessage("Email or password is incorrect.");
            return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });
        
        if (signUpError) {
           if(signUpError.message.includes("already registered")) {
            setError("This email is already registered. Please try another email.")
           } else {
            setError(signUpError.message);
           }
        }
        alert("Sign Up Successfully!");
        navigate("/signin")
    }

    return (
        <form onSubmit={handleSignUp} className=" flex flex-col gap-3 w-64">
            <div className="relative">
                <EnvelopeIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-white-500" />
                <input
                    type="email"
                    placeholder="Email"
                    className="p-2 border rounded w-full pr-10 overflow-x-auto whitespace-nowrap"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"} // toggle type
                    placeholder="Password"
                    className="p-2 border rounded w-full pr-10 overflow-x-auto whitespace-nowrap"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <span
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white-600"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeIcon className="w-5 h-5" />: <EyeSlashIcon className="w-5 h-5" /> }
                </span>
            </div>

            <button className="form-button bg-yellow-400 text-black p-2 rounded hover:bg-white">
                Sign Up
            </button>
            {error && <p className="form-error text-red-500 mt-2">{error}</p>}
        </form>
    );
}
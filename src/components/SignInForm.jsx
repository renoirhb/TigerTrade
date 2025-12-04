import { useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { EnvelopeIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SignInForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({email, password});
        if (error) setError("Email or password is incorrect!");
        else navigate("/user");
    };

    return(
        <form onSubmit={handleSignIn} className="form flex flex-col gap-3 w-64">
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
                    type={showPassword ? "text" : "password"}
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

            <button className="form-button form bg-yellow-400 text-black p-2 rounded hover:bg-white">
                Sign In
            </button>
            {error && <p className="form-error text-red-500 mt-2">{error}</p>}
        </form>

    )
}
import SignInForm from "../components/SignInForm";
import { Link } from "react-router-dom"

export default function SignInPage() {
    return (
        <div className="form flex flex-col text-white items-center p-6">
            <h2 className="intro mb-4">Sign In</h2>
            <SignInForm />

            <p className="form-footer mt-4">
                Don't have an account yet?{" "}
                <Link to="/signup" className="form-link text-yello-400 hover:underline">
                Sign up here.
                </Link>
            </p>
        </div>
    )
}
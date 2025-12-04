import SignUpForm from "../components/SignUpForm";
import { Link } from "react-router-dom"

export default function SignUpPage() {
    return (
        <div className="form flex flex-col text-white items-center p-6">
            <h2 className="intro mb-4">Create an Account</h2>
            <SignUpForm />
            <p className="form-footer mt-4 text-white">
                Back to sign in{" "}
                <Link to="/signin" className="form-link hover:underline">
                here.
                </Link>
            </p>
        </div>
    )
}